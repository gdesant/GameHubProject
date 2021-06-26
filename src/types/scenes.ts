import type Server from '../client/services/Server'

export interface IGameHubData
{
	server: Server
	onGameLaunch: (data: IGameSceneData) => void
}

export interface IGameSceneData
{
	server: Server
	onGameOver: () => void
}
