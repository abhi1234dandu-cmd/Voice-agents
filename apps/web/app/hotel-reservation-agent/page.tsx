import { AppHeader } from "@/components/AppHeader";
import { HotelReservationAgentConsole } from "@/components/elevenlabs/HotelReservationAgentConsole";

export default function HotelReservationAgentPage() {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen">
        <HotelReservationAgentConsole />
      </main>
    </>
  );
}
