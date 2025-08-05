import SearchInterface from "@/components/search/searchinterface"

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <SearchInterface />
      </div>
    </div>
  )
}
