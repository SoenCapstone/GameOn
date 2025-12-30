import { ContentArea } from "@/components/ui/content-area";
import { FormExample } from "@/components/form/form-example";

export default function Settings() {
  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "orange", mode: "form" }}
    >
      <FormExample />
    </ContentArea>
  );
}
