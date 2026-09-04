import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewManager } from '@common/services/managers/review/review';

interface Testimonial {
  name: string;
  text: string;
  initial: string;
}

@Component({
  selector: 'app-landing-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
})
export class LandingTestimonialsComponent implements OnInit{

  readonly testimonials: Testimonial[] = [
    { name: 'Sarah Johnson', text: 'The coffee is always on point and the pace feels calm even on busy mornings.', initial: 'S' },
    { name: 'Mike Chen', text: 'A dependable stop for lunch and meetings. The menu feels thoughtful.', initial: 'M' },
    { name: 'Anna Davis', text: 'Warm service, quick checkout, and pastries that disappear fast.', initial: 'A' },
  ];

  // Trace point: constructor()
  constructor(public reviewManager: ReviewManager) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.reviewManager.loadTopReviews();
  }
}
