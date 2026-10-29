
import Navbar from "@/components/Navbar";

const questions = [
  {
    question: "What is TicketCircle?",
    answer:
      "TicketCircle lets users search ticket listings and connect with sellers for eligible train and bus tickets.",
  },
  {
    question: "How do I search for a ticket?",
    answer:
      "Open Find Tickets, enter your departure city, destination city and travel date, then select Search Tickets.",
  },
  {
    question: "How do I list a ticket?",
    answer:
      "Sign in, select Sell a ticket, and complete the listing form. Only list tickets that the transport operator officially permits you to transfer.",
  },
  {
    question: "Are all tickets transferable?",
    answer:
      "No. Transfer rules depend on the transport operator and ticket type. Verify eligibility with the operator before paying or sharing ticket details.",
  },
  {
    question: "Does TicketCircle process payments?",
    answer:
      "The current TicketCircle interface connects buyers and sellers but does not process ticket payments.",
  },
  {
    question: "How do I manage my listings?",
    answer:
      "Open your profile menu and select Dashboard to view and manage your ticket listings.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold text-indigo-200">
            HELP CENTER
          </p>
          <h1 className="mt-2 text-4xl font-black">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-indigo-100">
            Find answers to common TicketCircle questions.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-4 px-5 py-8">
        {questions.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <summary className="cursor-pointer list-none font-bold text-slate-900">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span className="text-xl text-indigo-600 group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>

            <p className="mt-4 leading-7 text-slate-600">{item.answer}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
