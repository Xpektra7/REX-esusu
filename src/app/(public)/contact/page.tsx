export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">
        Have questions or need help? Reach out.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-card  p-6">
          <h2 className="font-semibold">Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            General inquiries
          </p>
          <a
            href="mailto:hello@esusu.app"
            className="text-sm text-primary hover:underline"
          >
            hello@esusu.app
          </a>
          <p className="mt-4 text-sm text-muted-foreground">Support</p>
          <a
            href="mailto:support@esusu.app"
            className="text-sm text-primary hover:underline"
          >
            support@esusu.app
          </a>
        </div>
        <div className="rounded-xl bg-card  p-6">
          <h2 className="font-semibold">Legal & Privacy</h2>
          <p className="mt-1 text-sm text-muted-foreground">Privacy concerns</p>
          <a
            href="mailto:privacy@esusu.app"
            className="text-sm text-primary hover:underline"
          >
            privacy@esusu.app
          </a>
          <p className="mt-4 text-sm text-muted-foreground">Security issues</p>
          <a
            href="mailto:security@esusu.app"
            className="text-sm text-primary hover:underline"
          >
            security@esusu.app
          </a>
        </div>
      </div>

      <section className="mt-10 rounded-xl bg-card  p-6">
        <h2 className="font-semibold">Send Us a Message</h2>
        <form className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              className="w-full rounded-lg bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="w-full rounded-lg bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="subject" className="mb-1 block text-sm font-medium">
              Subject
            </label>
            <select
              id="subject"
              className="w-full rounded-lg bg-background px-3 py-2 text-sm"
            >
              <option>General inquiry</option>
              <option>Support request</option>
              <option>Bug report</option>
              <option>Feature suggestion</option>
              <option>Privacy concern</option>
            </select>
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              placeholder="Your message..."
              className="w-full rounded-lg bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
          >
            Send Message
          </button>
        </form>
      </section>
    </div>
  );
}
