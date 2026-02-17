export interface Hotel {
    id: number;
    name: string;
    // il ? rende opzionale la proprietà
    city?: string;
    rating?: number;
    priceFrom?: number;
    images?: string[];
    description?: string;
}