import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HomePageContent } from "@/app/components/home-page-content/home-page-content";
import { HomeToastTrigger } from "@/app/components/toast/home-toast-trigger";
import { getHomeScreenData } from "@/app/services/home/get-home-screen-data";

export const dynamic = "force-dynamic";

type HomePageProps = {
    searchParams: Promise<{
        toast?: string;
        name?: string;
    }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/login");
    }

    const screenData = await getHomeScreenData(userId);

    if (!screenData) {
        redirect("/login");
    }

    const params = await searchParams;

    return (
        <>
            <HomeToastTrigger toastType={params.toast} name={params.name} />
            <HomePageContent screenData={screenData} />
        </>
    );
}
