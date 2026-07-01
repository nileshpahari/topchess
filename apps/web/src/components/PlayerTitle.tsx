import { Player } from "../screens/Game"

interface PlayerTitleProps {
    player: Player | undefined
    isSelf?: boolean
}

export const PlayerTitle = ({player, isSelf}: PlayerTitleProps) => {
    return (
        <div className="flex gap-1">
            <p>{player && (player.isGuest ? "Guest" : player.username)}</p>
            {isSelf &&
                <p className="text-gray-500">(You)</p>
            }
        </div>
    )
}
