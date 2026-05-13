
type LayoutProps = {
    children: any;
}

const AuthLayout = ({ children }: LayoutProps) => {
    return (
        <div>{children}</div>
    )
}

export default AuthLayout;