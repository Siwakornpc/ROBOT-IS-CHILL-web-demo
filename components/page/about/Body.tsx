import { DiscordMarkdown } from '../../DiscordMarkdown';

export default function Body() {
    return (
        <main className="ascroll-y w-full">
            <div className="main-body">
                <h2 className="text-label">About this website</h2>
                <hr />
                <DiscordMarkdown>{
`This website project was made to allow users to use parts of the bot, which includes the basic parts: **Macrosia**, **render** and **Search**.

It was made on the idea of the existing Macrosia Web Demo by <@581685961205874718>, which by default, only allows you to execute the code.`
                }</DiscordMarkdown>
            </div>
        </main>
    );
}