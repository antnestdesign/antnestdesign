export const metadata = {
  title: "AND OS",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AndOsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const query=new URLSearchParams();
  for(const key of ['view','estimateId','versionId','contractId','projectId','draftId','detailedId','editor']){
    const value=params[key];if(typeof value==='string'&&value.length<=100)query.set(key,value);
  }
  return (
    <main className="h-screen w-full overflow-hidden bg-black">
      <iframe
        src={`/os-app/index.html?${query}`}
        title="AND OS"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </main>
  );
}
