export default function Experience() {
  return (
    <div>
      <p className="uppercase tracking-[0.32em] text-[9px] md:text-xs mb-4 md:mb-10">
        Experience
      </p>

      <h2 className="text-[34px] md:text-5xl font-light leading-[1.08] mb-7 md:mb-12 break-keep">
        설계를 이해하는
        <br />
        시공 경험
      </h2>

      <div className="flex justify-between max-w-sm md:block md:space-y-8">
        <div>
          <h3 className="text-4xl md:text-6xl font-light mb-1">13</h3>
          <p className="text-[11px] md:text-base text-neutral-600 leading-5">
            Years
            <br />
            Experience
          </p>
        </div>

        <div>
          <h3 className="text-4xl md:text-6xl font-light mb-1">
            20,000㎡+
          </h3>
          <p className="text-[11px] md:text-base text-neutral-600 leading-5">
            Project
            <br />
            Scale
          </p>
        </div>

        <div>
          <h3 className="text-4xl md:text-6xl font-light mb-1">80+</h3>
          <p className="text-[11px] md:text-base text-neutral-600 leading-5">
            Portfolio
            <br />
            Images
          </p>
        </div>
      </div>
    </div>
  );
}