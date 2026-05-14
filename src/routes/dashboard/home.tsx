import { createFileRoute } from '@tanstack/react-router'
import DashboardLayout from '../../componennts/DashboardLayout'

export const Route = createFileRoute('/dashboard/home')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DashboardLayout pageTitle='Home' subTitle='The home page'><></></DashboardLayout>
}
