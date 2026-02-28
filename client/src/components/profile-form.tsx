import { useForm } from "@tanstack/react-form";

export function ProfileForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      // Placeholder: wire to /users/me API when domain migration is completed.
      console.info("profile_form_submit", value);
    },
  });

  return (
    <form
      className="card form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <h2>Profile Settings</h2>
      <form.Field name="name">
        {(field) => (
          <label>
            Name
            <input
              type="text"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
            />
          </label>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <label>
            Email
            <input
              type="email"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
            />
          </label>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
