import { createApp, defineCustomElement } from "vue";
import App from "./App.vue";
import { router } from "./router";
import mdiVue from "mdi-vue/v3";
import { mdiIcons } from "./lib/icons";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import AdminPanel from "./components/AdminPanel.vue";
import adminCss from "./admin.css?inline";

createApp(App)
    .use(mdiVue, {
        icons: mdiIcons,
    })
    .use(VueQueryPlugin)
    .use(router)
    .mount("#app");

if (!customElements.get("admin-panel")) {
    const AdminPanelElement = defineCustomElement(AdminPanel, {
        styles: [adminCss],
        configureApp: (app) => {
            app.use(mdiVue, {
                icons: mdiIcons,
            });
            app.use(VueQueryPlugin, {
                queryClient: new QueryClient(),
            });
        },
    });
    customElements.define("admin-panel", AdminPanelElement);
}
