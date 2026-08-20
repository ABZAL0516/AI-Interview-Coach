document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) return;

  const previous = readStorage('interviewSetup');
  if (previous?.role) document.querySelector(`input[name="role"][value="${CSS.escape(previous.role)}"]`)?.click();
  if (previous?.experience) document.querySelector(`input[name="experience"][value="${CSS.escape(previous.experience)}"]`)?.click();

  $('#setupForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.querySelector('input[name="role"]:checked')?.value;
    const experience = document.querySelector('input[name="experience"]:checked')?.value;
    if (!role || !experience) {
      toast('Please choose a role and experience level.');
      return;
    }
    localStorage.setItem('interviewSetup', JSON.stringify({ role, experience }));
    go('interview');
  });
});
