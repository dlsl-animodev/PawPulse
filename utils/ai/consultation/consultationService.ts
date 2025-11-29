import { createBlob, decode, decodeAudioData } from "@/utils/audio/audioUtils";
import { createClient } from "@/utils/supabase/client";
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
} from "@google/genai";

const getMyPetsDeclaration: FunctionDeclaration = {
  name: "getMyPets",
  description:
    "Retrieves the list of pets belonging to the currently authenticated user. Use this to help the user select which pet the appointment is for.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const checkAuthStatusDeclaration: FunctionDeclaration = {
  name: "checkAuthStatus",
  description:
    "Checks if the user is currently signed in. Use this to verify if the user can access their pets or needs to sign in.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getDoctorsDeclaration: FunctionDeclaration = {
  name: "getDoctors",
  description:
    "Searches for available veterinarians. Use this when the user asks for a specific doctor or wants to know who is available. If the user says 'any', you can list a few available doctors or pick one for them.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          "The name of the doctor to search for, or empty to list all available doctors.",
      },
    },
  },
};

const completeConsultationDeclaration: FunctionDeclaration = {
  name: "completeConsultation",
  description:
    "Call this IMMEDIATELY when you have gathered the required information (pet name, type, and symptoms). Do not ask for confirmation. Just call this function.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      petName: {
        type: Type.STRING,
        description: "The name of the pet.",
      },
      petType: {
        type: Type.STRING,
        description: "The type of animal (e.g., Dog, Cat, Bird).",
      },
      petBreed: {
        type: Type.STRING,
        description: "The breed of the pet, if known.",
      },
      petAge: {
        type: Type.STRING,
        description: "The age of the pet.",
      },
      summary: {
        type: Type.STRING,
        description:
          "A detailed summary of the pet's symptoms, duration, and severity.",
      },
      preferredDoctorId: {
        type: Type.STRING,
        description: "The ID of the selected veterinarian.",
      },
      preferredDoctorName: {
        type: Type.STRING,
        description: "The name of the selected veterinarian.",
      },
      preferredDate: {
        type: Type.STRING,
        description:
          "The preferred date for the appointment. Try to convert to YYYY-MM-DD format if possible, or use relative terms like 'tomorrow'.",
      },
      preferredTime: {
        type: Type.STRING,
        description:
          "The preferred time for the appointment. Try to convert to HH:MM format (24h) if possible, or use terms like 'morning'.",
      },
    },
    required: ["summary", "petName", "petType"],
  },
};

const MODEL_NAME = "gemini-2.5-flash-native-audio-preview-09-2025";
const SYSTEM_INSTRUCTION = `
You are a gentle, patient, and professional AI Veterinary Assistant for PawPulse.
Your goal is to triage the user's request and gather information for the doctor. You DO NOT book the appointment yourself. You just collect the info.

Protocol:
1. Greet the user warmly and ask for the pet's name and type.
2. Gather pet details: Name, Type (Dog, Cat, etc.), Breed (optional), and Age.
3. Gather key details about the issue: Main symptom, Duration, Severity.
4. Ask if they have a preferred veterinarian. If they mention a name or say "any", use the getDoctors tool to find a match or suggest one.
5. Ask for preferred date or time for the appointment. Try to get a specific date (YYYY-MM-DD) and time (HH:MM) if possible.
6. CRITICAL: As soon as you have the Pet Name, Pet Type, and Symptoms, you can proceed. If the user provides preferences, include them.
7. When you have the info, Tell the user you are completing the consultation and they need to confirm the appointment on the next page. IMMEDIATELY call the completeConsultation tool with the collected info. Do NOT ask for confirmation after saying.

Tone: Empathetic, Trustworthy, Calm. Keep sentences short.
`;

export interface ConsultationResult {
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: string;
  summary: string;
  preferredDoctorId?: string;
  preferredDoctorName?: string;
  preferredDate?: string;
  preferredTime?: string;
}

interface LiveSessionCallbacks {
  onConnectionChange: (connected: boolean) => void;
  onText: (text: string, isFinal: boolean) => void;
  onInputText: (text: string) => void;
  onAudioData: (buffer: AudioBuffer) => void;
  onOptionsReceived: (options: string[], question: string) => void;
  onComplete: (result: ConsultationResult) => void;
  onError: (error: Error) => void;
  onInterrupted: () => void;
}

export class ConsultationService {
  private client: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private callbacks: LiveSessionCallbacks;
  private nextPlayTime = 0;

  constructor(apiKey: string, callbacks: LiveSessionCallbacks) {
    this.client = new GoogleGenAI({ apiKey });
    this.callbacks = callbacks;
  }

  public async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.inputAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 });

      await this.inputAudioContext.audioWorklet.addModule(
        "/worklets/audio-processor.js"
      );

      this.outputAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 24000 });

      this.sessionPromise = this.client.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: () => this.callbacks.onConnectionChange(false),
          onerror: (e) => this.callbacks.onError(new Error(e.message)),
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          tools: [
            {
              functionDeclarations: [
                completeConsultationDeclaration,
                getMyPetsDeclaration,
                checkAuthStatusDeclaration,
                getDoctorsDeclaration,
              ],
            },
          ],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });
    } catch (err) {
      this.callbacks.onError(err as Error);
    }
  }

  private handleOpen() {
    this.callbacks.onConnectionChange(true);
    if (!this.stream || !this.inputAudioContext) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(
      this.inputAudioContext,
      "audio-processor"
    );

    this.workletNode.port.onmessage = (event) => {
      const inputData = event.data;
      const pcmBlob = createBlob(inputData);

      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.source.connect(this.workletNode);
    // this.workletNode.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (
          part.inlineData &&
          part.inlineData.mimeType &&
          part.inlineData.mimeType.startsWith("audio/")
        ) {
          const base64 = part.inlineData.data;
          if (base64 && this.outputAudioContext) {
            const audioData = decode(base64);
            const audioBuffer = await decodeAudioData(
              audioData,
              this.outputAudioContext,
              24000,
              1
            );
            this.playAudio(audioBuffer);
          }
        }
      }
    }

    if (message.serverContent?.outputTranscription?.text) {
      this.callbacks.onText(
        message.serverContent.outputTranscription.text,
        false
      );
    }

    if (message.serverContent?.inputTranscription?.text) {
      this.callbacks.onInputText(message.serverContent.inputTranscription.text);
    }

    if (message.serverContent?.turnComplete) {
      this.callbacks.onText("", true);
    }

    if (message.serverContent?.interrupted) {
      this.callbacks.onInterrupted();
    }

    if (message.toolCall) {
      const toolCall = message.toolCall;
      for (const fc of toolCall.functionCalls ?? []) {
        // if (fc.name === 'suggestOptions') {
        //   const { options, question } = fc.args as any;
        //   this.callbacks.onOptionsReceived(options, question);
        //   // Respond to the tool to let the model know the UI is shown
        //   this.sendToolResponse(fc.id, fc.name, { result: 'Options displayed to user. Waiting for selection.' });
        // } else

        if (fc.name === "getMyPets") {
          const supabase = createClient();
          const { data, error } = await supabase.rpc("get_my_pets");
          if (error) {
            this.sendToolResponse(fc.id, fc.name, { error: error.message });
          } else {
            this.sendToolResponse(fc.id, fc.name, { pets: data });
          }
        }

        if (fc.name === "checkAuthStatus") {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          this.sendToolResponse(fc.id, fc.name, {
            isAuthenticated: !!user,
            userId: user?.id,
          });
        }

        if (fc.name === "getDoctors") {
          const args = fc.args as any;
          const query = args.query || "";
          const supabase = createClient();
          let dbQuery = supabase
            .from("veterinarians")
            .select("id, name, specialty")
            .eq("is_available", true);

          if (query && query.toLowerCase() !== "any") {
            dbQuery = dbQuery.ilike("name", `%${query}%`);
          }

          const { data, error } = await dbQuery.order("name").limit(5);

          if (error) {
            this.sendToolResponse(fc.id, fc.name, { error: error.message });
          } else {
            this.sendToolResponse(fc.id, fc.name, { doctors: data });
          }
        }

        if (fc.name === "completeConsultation") {
          const args = fc.args as any;
          this.callbacks.onComplete({
            petName: args.petName,
            petType: args.petType,
            petBreed: args.petBreed,
            petAge: args.petAge,
            summary: args.summary,
            preferredDoctorId: args.preferredDoctorId,
            preferredDoctorName: args.preferredDoctorName,
            preferredDate: args.preferredDate,
            preferredTime: args.preferredTime,
          });
          this.sendToolResponse(fc.id, fc.name, {
            result: "Consultation completed.",
          });
          // }
        }
      }
    }
  }

  private sendToolResponse(id?: string, name?: string, response?: any) {
    this.sessionPromise?.then((session) => {
      session.sendToolResponse({
        functionResponses: {
          id,
          name,
          response,
        },
      });
    });
  }

  public sendTextResponse(text: string) {
    this.sessionPromise?.then((session) => {
      // Send the text as a user turn
      session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text: text }],
          },
        ],
        turnComplete: true,
      });
    });
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputAudioContext) return;

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAudioContext.destination);

    const currentTime = this.outputAudioContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;

    this.callbacks.onAudioData(buffer);
  }

  public setMuted(muted: boolean) {
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public async stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.source?.disconnect();
    this.workletNode?.disconnect();
    await this.inputAudioContext?.close();
    await this.outputAudioContext?.close();
    this.callbacks.onConnectionChange(false);
  }
}
