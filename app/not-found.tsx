import { InvalidPage } from "@/components/app/InvalidPage";

export default function NotFoundPage() {
  return (
    <InvalidPage
      actionLabel="Go to OiOi Melting Dashboard"
      eyebrow="OiOi Melting Dashboard"
      href="/"
      message="This page does not exist here. Please double-check the URL or return to the dashboard home."
      title="Page not found"
    />
  );
}
