import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-demo-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './demo-header.component.html',
  styleUrl: './demo-header.component.scss'
})
export class DemoHeaderComponent {
  @Input({ required: true }) title!: string;
}
