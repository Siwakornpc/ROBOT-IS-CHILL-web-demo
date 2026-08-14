export function nav_btn_select(name: string) {
    const nav_btn = document.querySelector(`.nav-btn[aria-label='{name}']`);

    nav_btn?.classList.add("selected");
}


