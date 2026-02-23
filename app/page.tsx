import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HomePageContent } from "@/app/components/home-page-content/home-page-content";
import { getHomeScreenData } from "@/app/services/home/get-home-screen-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/login");
    }

    const screenData = await getHomeScreenData(userId);

    if (!screenData) {
        redirect("/login");
    }

    return <HomePageContent screenData={screenData} />;
}
