import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-image-upload',
  templateUrl: './chat-bot.component.html',
  styleUrl: './chat-bot.component.css'
})
export class ChatBotComponent {
  question: string = '';
  selectedFile: File | null = null;
  answer: string | null = null;

  constructor(private http: HttpClient) {
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  askQuestion() {
    if (!this.question) {
      alert('Please enter a question.');
      return;
    }

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    formData.append('question', this.question);

    this.http.post<{ answer: string }>(
      'https://api.tony19907051.com/wits/ask',
      formData
    ).subscribe({
      next: (res: any) => {
        this.answer = res.answer;
      },
      error: (err: any) => {
        console.error(err);
        alert('Error querying the backend');
      }
    });
  }
}
