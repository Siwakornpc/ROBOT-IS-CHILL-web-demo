import Body from "@/components/page/render/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";

export default function Home() {
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
            <RightBar />
        </main>
    );
}
