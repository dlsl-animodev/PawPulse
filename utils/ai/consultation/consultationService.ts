import { createBlob } from "@/utils/audio/audioUtils";
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
} from "@google/genai";

const completeConsultationDeclaration: FunctionDeclaration = {
  name: "completeConsultation",
  description:
    "Call this when you have gathered enough information to book a vet appointment. You need to collect pet details, symptoms, and optionally preferred doctor, date, and time.",
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
      preferredDoctor: {
        type: Type.STRING,
        description:
          "The name of the veterinarian the user wants to see, if any.",
      },
      preferredDate: {
        type: Type.STRING,
        description:
          "The preferred date for the appointment (e.g., 'tomorrow', 'next Monday', or a specific date).",
      },
      preferredTime: {
        type: Type.STRING,
        description:
          "The preferred time for the appointment (e.g., 'morning', '2 PM').",
      },
    },
    required: ["summary", "petName", "petType"],
  },
};

const MODEL_NAME = "gemini-2.5-flash-native-audio-preview-09-2025";
const SYSTEM_INSTRUCTION = `
You are a gentle, patient, and professional AI Veterinary Assistant for CareLink.
Your goal is to help the user book a vet appointment by gathering their pet's details, symptoms and preferences.

Protocol:
1. Greet the user warmly (e.g., "Hello, I'm CareLink. I can help you book a vet appointment. First, could you tell me your pet's name and what kind of animal they are?").
2. Gather pet details: Name, Type (Dog, Cat, etc.), Breed (optional), and Age.
3. Gather key details about the issue: Main symptom, Duration, Severity.
4. Ask if they have a preferred veterinarian, date, or time for the appointment.
5. Once you have the information, call the completeConsultation function.

Tone: Empathetic, Trustworthy, Calm. Keep sentences short.
`;

export interface ConsultationResult {
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: string;
  summary: string;
  preferredDoctor?: string;
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
              functionDeclarations: [completeConsultationDeclaration],
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
    this.workletNode.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
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

        if (fc.name === "completeConsultation") {
          const args = fc.args as any;
          this.callbacks.onComplete({
            petName: args.petName,
            petType: args.petType,
            petBreed: args.petBreed,
            petAge: args.petAge,
            summary: args.summary,
            preferredDoctor: args.preferredDoctor,
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
      session.sendRealtimeInput({
        content: {
          role: "user",
          parts: [{ text: text }],
        },
      });
    });
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
