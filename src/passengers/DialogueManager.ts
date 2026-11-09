// Authentic Dhaka Bangla Dialogue & Fare Negotiation System
import { PassengerData, DialogueStep, DialogueChoice } from '../types';
import { AudioManager } from '../engine/AudioManager';

export class DialogueManager {
  private audioManager: AudioManager;
  public activePassenger: PassengerData | null = null;
  public currentStep: DialogueStep | null = null;
  public agreedFare: number = 0;
  public onFareAgreed: ((fare: number) => void) | null = null;
  public onDialogueEnded: ((status: 'agreed' | 'rejected') => void) | null = null;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  // Initiate negotiation when player stops and presses [E] near passenger
  public startNegotiation(passenger: PassengerData): DialogueStep {
    this.activePassenger = passenger;
    passenger.status = 'bargaining';

    // Initial inquiry from passenger
    const voiceType = passenger.archetype === 'student' 
      ? 'young_male' 
      : passenger.archetype === 'elderly' 
        ? 'elderly_male' 
        : passenger.archetype === 'shopper' 
          ? 'young_female' 
          : 'adult_male';

    const firstStep: DialogueStep = {
      speaker: 'passenger',
      speakerNameBangla: passenger.nameBangla,
      textBangla: `মামা, ${passenger.destinationNameBangla} যাবেন? ভাড়া কত?`,
      textEnglish: `Mama, will you go to ${passenger.destinationNameEnglish}? How much fare?`,
      audioVoiceType: voiceType,
      choices: this.generateInitialDriverChoices(passenger)
    };

    this.currentStep = firstStep;
    this.speakCurrentStep();
    return firstStep;
  }

  // Generate driver's responses based on distance and passenger target fare
  private generateInitialDriverChoices(passenger: PassengerData): DialogueChoice[] {
    const target = passenger.targetFare;
    const fairQuote = Math.round(target * 1.15 / 10) * 10;
    const highQuote = Math.round(target * 1.45 / 10) * 10;

    return [
      {
        id: 'quote_fair',
        labelBangla: `যামু, ৳${fairQuote} দিয়েন`,
        labelEnglish: `Will go, give ৳${fairQuote}`,
        fareOffer: fairQuote,
        type: 'counter'
      },
      {
        id: 'quote_high',
        labelBangla: `রাস্তায় জ্যাম, ৳${highQuote} লাগবো`,
        labelEnglish: `Heavy traffic, need ৳${highQuote}`,
        fareOffer: highQuote,
        type: 'counter'
      },
      {
        id: 'quote_meter',
        labelBangla: `মিটারের সাথে বিশ টাকা বেশি দিয়েন`,
        labelEnglish: `Meter plus 20 BDT extra`,
        fareOffer: target + 20,
        type: 'meter_plus'
      },
      {
        id: 'reject',
        labelBangla: `না ভাই, ঐদিকে যামু না`,
        labelEnglish: `No brother, not going that side`,
        type: 'reject'
      }
    ];
  }

  // Handle player selection of a dialogue choice
  public chooseOption(choice: DialogueChoice): DialogueStep | null {
    if (!this.activePassenger) return null;

    if (choice.type === 'reject') {
      const step: DialogueStep = {
        speaker: 'driver',
        speakerNameBangla: 'সিএনজি চালক মামা (আপনি)',
        textBangla: 'না ভাই, ঐদিকে এখন যাওয়া সম্ভব না।',
        textEnglish: 'No brother, cannot go that way right now.',
        audioVoiceType: 'adult_male'
      };
      this.currentStep = step;
      this.speakCurrentStep();
      setTimeout(() => {
        if (this.onDialogueEnded) this.onDialogueEnded('rejected');
      }, 1400);
      return step;
    }

    const proposedFare = choice.fareOffer || this.activePassenger.targetFare;

    // Check passenger willingness
    if (proposedFare <= this.activePassenger.targetFare * 1.05) {
      // Passenger accepts immediately
      this.agreedFare = proposedFare;
      const step: DialogueStep = {
        speaker: 'passenger',
        speakerNameBangla: this.activePassenger.nameBangla,
        textBangla: `আইচ্ছা মামা, চলেন। উঠতাছি।`,
        textEnglish: `Alright mama, let's go. Getting in.`,
        audioVoiceType: this.getVoiceType(this.activePassenger)
      };
      this.currentStep = step;
      this.speakCurrentStep();
      setTimeout(() => {
        if (this.onFareAgreed) this.onFareAgreed(this.agreedFare);
        if (this.onDialogueEnded) this.onDialogueEnded('agreed');
      }, 1500);
      return step;
    } else if (proposedFare <= this.activePassenger.maxFare) {
      // Passenger counters with a middle offer
      const counterFare = Math.round((this.activePassenger.targetFare + proposedFare) / 2 / 5) * 5;
      const step: DialogueStep = {
        speaker: 'passenger',
        speakerNameBangla: this.activePassenger.nameBangla,
        textBangla: `এত বেশি কেন মামা? ৳${counterFare} রাখেন, যাই।`,
        textEnglish: `Why so high mama? Keep it ৳${counterFare}, let's go.`,
        audioVoiceType: this.getVoiceType(this.activePassenger),
        choices: [
          {
            id: 'accept_counter',
            labelBangla: `আচ্ছা উঠেন, ৳${counterFare} দিয়েন`,
            labelEnglish: `Alright get in, give ৳${counterFare}`,
            fareOffer: counterFare,
            type: 'agree'
          },
          {
            id: 'firm_fare',
            labelBangla: `না মামা, ৳${proposedFare} এর এক টাকাও কম না`,
            labelEnglish: `No mama, not a single taka less than ৳${proposedFare}`,
            fareOffer: proposedFare,
            type: 'counter'
          },
          {
            id: 'reject',
            labelBangla: `থাক ভাই, নামেন`,
            labelEnglish: `Nevermind, find another ride`,
            type: 'reject'
          }
        ]
      };
      this.currentStep = step;
      this.speakCurrentStep();
      return step;
    } else {
      // Price is too high, passenger walks away
      const step: DialogueStep = {
        speaker: 'passenger',
        speakerNameBangla: this.activePassenger.nameBangla,
        textBangla: `কী বলেন মিয়া! এত ভাড়া? অন্য সিএনজি দেখমু।`,
        textEnglish: `What are you saying! So much fare? I'll find another CNG.`,
        audioVoiceType: this.getVoiceType(this.activePassenger)
      };
      this.currentStep = step;
      this.speakCurrentStep();
      setTimeout(() => {
        if (this.onDialogueEnded) this.onDialogueEnded('rejected');
      }, 1600);
      return step;
    }
  }

  private speakCurrentStep(): void {
    if (!this.currentStep) return;
    this.audioManager.speakBanglaDialogue(
      this.currentStep.textBangla,
      this.currentStep.audioVoiceType || 'adult_male'
    );
  }

  private getVoiceType(passenger: PassengerData): 'young_male' | 'young_female' | 'adult_male' | 'elderly_male' {
    if (passenger.archetype === 'student') return 'young_male';
    if (passenger.archetype === 'elderly') return 'elderly_male';
    if (passenger.archetype === 'shopper') return 'young_female';
    return 'adult_male';
  }
}
