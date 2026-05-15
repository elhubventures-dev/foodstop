import RestaurantDiscovery from '@/components/restaurants/RestaurantDiscovery';
import './restaurants.css';

export const metadata = {
  title: 'Restaurants | Food Stop',
  description:
    'Discover restaurants near you — filters, ratings, and distance from your location.',
};

export default function RestaurantsPage() {
  return <RestaurantDiscovery />;
}
