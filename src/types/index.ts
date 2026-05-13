export type User = {
    id: '',
    name: '',
    role: '',
}

export type TActiveProperty = {
    id:''
}

export type RootRouteContext = {
    user: User | null,
    activeProperty: TActiveProperty | null,
    loggedIn:boolean,
    login: (user: User) => void,
    logout: () => void,
    setActiveProperty: (property: TActiveProperty) => void
}