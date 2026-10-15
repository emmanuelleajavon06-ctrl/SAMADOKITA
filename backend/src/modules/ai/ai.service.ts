import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AiService {
  async chat(question: string, context: string): Promise<Observable<{ data: string }>> {
    const response = this.generateResponse(question, context);
    return new Observable((subscriber) => {
      let i = 0;
      const words = response.split(" ");
      const interval = setInterval(() => {
        if (i < words.length) {
          subscriber.next({ data: JSON.stringify({ token: words[i] + (i < words.length - 1 ? " " : "") }) });
          i++;
        } else {
          subscriber.next({ data: JSON.stringify({ done: true }) });
          subscriber.complete();
          clearInterval(interval);
        }
      }, 80);
      return () => clearInterval(interval);
    });
  }

  private generateResponse(question: string, context: string): string {
    const q = question.toLowerCase();
    if (q.includes("rendez-vous") || q.includes("rdv")) {
      return "Pour prendre rendez-vous, accédez à la section Rendez-vous et sélectionnez un médecin disponible. Vous pouvez choisir une consultation présentielle ou une téléconsultation.";
    }
    if (q.includes("ordonnance") || q.includes("medicament")) {
      return "Vos ordonnances sont disponibles dans la section Prescriptions. Chaque ordonnance contient un QR code vérifiable et un PDF téléchargeable.";
    }
    if (q.includes("urgence") || q.includes("sos")) {
      return "En cas d'urgence, utilisez le bouton SOS sur votre tableau de bord. Votre position sera partagée aux médecins dans un rayon de 5 km.";
    }
    return "Je suis l'assistant SamaDokita. Je peux vous aider avec vos rendez-vous, ordonnances, résultats de laboratoire et informations de santé. Comment puis-je vous aider aujourd'hui ?";
  }
}
