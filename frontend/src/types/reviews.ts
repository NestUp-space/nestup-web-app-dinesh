export interface Review {
  id: number;
  name: string;
  rating: number;
  review: string;
}

export interface ReviewsData {
  reviews: Review[];
}
