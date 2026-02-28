interface PageTemplateProps {
  title: string;
  description: string;
}

export function PageTemplate({ title, description }: PageTemplateProps) {
  return (
    <section className="card">
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
