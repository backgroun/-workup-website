import { redirect } from "next/navigation";

export default function ManufacturersRedirect() {
  redirect("/admin/brands");
}
