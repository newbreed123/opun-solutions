export default function PreviewListingNotice() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
      Preview homes for internal review only. This is not live MLS inventory.
    </div>
  );
}
