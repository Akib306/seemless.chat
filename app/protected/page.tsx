import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Seamless Chat</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user.email}</p>
      </div>
      
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Multi-AI Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-[400px]">
          <div className="bg-secondary p-3 rounded-lg w-fit max-w-[80%]">
            Hello! I'm your AI assistant. How can I help you today?
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Input placeholder="Type your message..." className="flex-1" />
          <Button>Send</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
