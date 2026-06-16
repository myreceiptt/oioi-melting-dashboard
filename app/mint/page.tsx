import { InvalidPage } from "@/components/app/InvalidPage";

export default function MintIndexPage() {
  return (
    <InvalidPage
      actionLabel="Go to OiOi Melting Dashboard"
      eyebrow="NFT Mint Page"
      href="https://softstaking.endhonesa.com/"
      message="You typed something wrong! Please double-check the URL you try to visit!"
      title="Invalid mint page"
    />
  );
}
