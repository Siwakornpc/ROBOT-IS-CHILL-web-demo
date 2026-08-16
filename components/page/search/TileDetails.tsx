import { type SelectedTile } from "./SearchResultsGrid";

export default function TileDetails({
    selectedTile,
}: {
    selectedTile: SelectedTile;
}) {
    const { name, tile } = selectedTile;

    return (
        <div className="search-details-panel">
            <h1>{name}</h1>
            <img src={`https://ric-api.sno.mba/tiles/${encodeURIComponent(name)}.gif`} alt={name} className="search-details-image"/>
            <table>
                <tbody>
                    <tr>
                        <th className="table-description">Description</th>
                        <th>Label</th>
                    </tr>
                    <tr>
                        <td>Active color</td>
                        <td>{tile.active_color.join(", ")}</td>
                    </tr>
                    <tr>
                        <td>Inactive color</td>
                        <td>{tile.inactive_color.map((value) => value ?? "none").join(", ")}</td>
                    </tr>
                    <tr>
                        <td>Source</td>
                        <td>{tile.sprite[0]}</td>
                    </tr>
                    <tr>
                        <td>Sprite</td>
                        <td>{tile.sprite[1]}</td>
                    </tr>
                    <tr>
                        <td>Tags</td>
                        <td>{tile.tags.length ? tile.tags.join(", ") : "None"}</td>
                    </tr>
                    <tr>
                        <td>Tiling</td>
                        <td>{tile.tiling}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
