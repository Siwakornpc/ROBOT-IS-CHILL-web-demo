export function nav_btn_select(name: string) {
    const nav_btn = document.querySelector(`.nav-btn[aria-label='${name}']`) as HTMLElement;

    if (nav_btn) {
        nav_btn.classList.add("selected");
        nav_btn.removeAttribute("href");
        
        nav_btn.style.cursor = "default";

        nav_btn.addEventListener("click", (e) => {
            e.preventDefault();
        });
    }
}
