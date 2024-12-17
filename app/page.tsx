import { PayBlock } from "@/components/Pay";
import { SignIn } from "@/components/SignIn";
import { VerifyBlock } from "@/components/Verify";
import ExchangeBlock from "./exchange/page";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {/* <SignIn />
      <VerifyBlock /> */}
      {/* <PayBlock /> */}

      <ExchangeBlock></ExchangeBlock>
    </main>
  );
}
