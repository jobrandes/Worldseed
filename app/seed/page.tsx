import SeedForm from "@/components/SeedForm";

export default function SeedPage() {
  return (
    <main>
      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl text-mist-100 tracking-wide">
          Worldseed
        </h1>
        <p className="mt-3 text-sm sm:text-base text-mist-400">
          Plant a seed. Return to find it has grown.
        </p>
      </div>
      <SeedForm />
    </main>
  );
}
