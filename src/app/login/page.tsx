import { login, signup } from "./actions"

export default function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Palboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Sign in to your dashboard</p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
             <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="name">
              Name (Sign up only)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Palash"
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-50"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              formAction={login}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </form>

        {searchParams?.message && (
          <p className="mt-4 text-center text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-2 rounded">
            {searchParams.message}
          </p>
        )}
      </div>
    </div>
  )
}
