import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const makeAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test/make-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to make user admin");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "You are now an admin! Please refresh the page to see admin features.",
      });
    } catch (error) {
      console.error("Error making user admin:", error);
      toast({
        title: "Error",
        description: "Failed to make user admin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={makeAdmin}
      disabled={isLoading}
      variant="outline"
      className="mb-4"
    >
      <Shield className="h-4 w-4 mr-2" />
      {isLoading ? "Making Admin..." : "Make Me Admin (Dev)"}
    </Button>
  );
}