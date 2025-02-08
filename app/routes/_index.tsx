import { Send } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function AppHome() {
  return <div className="flex h-full items-center justify-center">
    <div className="w-full max-w-[800px] space-y-2 flex flex-col text-center">
      <h1 className="text-xl font-semibold mb-2">How may I help you?</h1>
      <Input placeholder="Ask me anything..." className="h-12 shadow-md" autoFocus />
      <div className="w-full flex justify-end">
        <Button><Send /> Send</Button>
      </div>
    </div>
  </div>;
}
