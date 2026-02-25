import { redirect } from "next/navigation";

import { HomePageContent } from "@/app/components/home-page-content/home-page-content";
import { HomeToastTrigger } from "@/app/components/toast/home-toast-trigger";
import { getHomeScreenData } from "@/app/services/home/get-home-screen-data";
import { getAuthorizedUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

type HomePageProps = {
    searchParams: Promise<{
        toast?: string;
        name?: string;
    }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
    const user = await getAuthorizedUser();

    const screenData = await getHomeScreenData(user.id);
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
