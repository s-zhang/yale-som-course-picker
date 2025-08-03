import CoursePicker from "@/components/course-picker";
import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const scheduledParam = searchParams?.scheduled;
  const scheduled = Array.isArray(scheduledParam) ? scheduledParam.join(",") : scheduledParam;
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;
  const imageUrl = scheduled ? `${origin}/opengraph-image?scheduled=${scheduled}` : `${origin}/opengraph-image`;
  return {
    openGraph: {
      title: "MySOMClasses",
      description: "Course selection website for Yale School of Management",
      images: [{ url: imageUrl }],
    },
  };
}

export default function Page() {
  return <CoursePicker />;
}
