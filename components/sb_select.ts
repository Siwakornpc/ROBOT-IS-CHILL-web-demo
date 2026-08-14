export function sb_btn_select(name: string) {
    const sb_btn = document.querySelector(`.sb-btn:has(.icon.${name})`);

    sb_btn?.classList.add("selected");
    sb_btn?.querySelector(`.icon.${name}`)?.classList.add("selected");
}


