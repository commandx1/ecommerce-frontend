import type { Metadata } from "next"
import HomePage from "@/features/home/HomePage"

export const metadata: Metadata = {
  title: "DentyPro",
}

export default function Home() {
  return <HomePage />
}
