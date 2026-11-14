/* =====================================================================
   TURNING POINT — site content
   ---------------------------------------------------------------------
   Everything you will want to edit lives in this one file.
   - Text may contain simple HTML (<em>, <strong>, <a href>, <br>).
   - Paths are relative to index.html (e.g. "assets/img/structure.jpg").
   - Inside `intro`, a link like <a data-go="structure">…</a> opens
     that section of the page instead of navigating away.

   Box types you can use inside a section's `items` list:
     { type: "text",    span, title, body }
     { type: "image",   span, src, alt, caption, ratio }        ratio e.g. "4/3"
     { type: "video",   span, src, poster, caption, ratio }     self-hosted .mp4
     { type: "embed",   span, src, caption, ratio }             YouTube / Vimeo embed URL
     { type: "project", index, title, text, href, thumb, status, newTab }
     { type: "event",   span, date, time, title, place, text, link, linkLabel }
     { type: "credits", span, groups: [{ role, names: [] }] }
     { type: "links",   span, title, links: [{ label, url }] }
   `span` = how many of the four content columns the box spans (1–4).
   On phones every box is full width.
   Consecutive "project" boxes are shown together as one sideways-
   scrolling row of tall cards (thumbnails look best at 3:5, portrait).
   ===================================================================== */

window.SITE = {
  title: "Turning Point",
  meta: "Delhi Art Biennale 2026",

  intro: [
    "<span class='sc'>Turning Point</span> is an installation project by Anant University, created for the Delhi Art Biennale 2026.",
    "At its core is a physical structure made of four spiralling steel columns that are held together in dynamic balance. Each 6 meter tall column rotates gradually from the base and is imbricated with patterns of emergent life-processes.",
    "The work is an exploration of looking at and through these perforations, pondering the relationships with self, other and cosmos at large.",
    "You can <a data-go='explore'>explore</a> interactive interpretations of the site and its themes, read more about the <a data-go='structure'>structure</a> and its construction, see upcoming <a data-go='events'>events</a>, or find out about the <a data-go='credits'>team</a> that built the project."
  ],

  socials: [
    { label: "Instagram", url: "#" },   // ← replace with real URLs
    { label: "YouTube",   url: "#" }
  ],

  /* Order here = order in the menu */
  sections: [
    /* ------------------------------------------------------------- */
    {
      id: "explore",
      label: "Explore",
      heading: "Interactive interpretations",
      lede: "A series of interactive explorations of the site and its themes. Each opens on its own page.",
      items: [
        {
          type: "project", index: "01",
          title: "Confluence",
          text: "Placeholder — a short description of Confluence: its question, and what the visitor does.",
          href: "explorations/confluence/index.html",
          thumb: "assets/img/explore/confluence.jpg",
          status: "In progress"
        },
        {
          type: "project", index: "02",
          title: "Metamorphosis",
          text: "Placeholder — a short description of Metamorphosis: its question, and what the visitor does.",
          href: "explorations/metamorphosis/index.html",
          thumb: "assets/img/explore/metamorphosis.jpg",
          status: "In progress"
        },
        {
          type: "project", index: "03",
          title: "Flux",
          text: "Placeholder — a short description of Flux: its question, and what the visitor does.",
          href: "explorations/flux/index.html",
          thumb: "assets/img/explore/flux.jpg",
          status: "In progress"
        },
        {
          type: "project", index: "04",
          title: "Emergence",
          text: "Placeholder — a short description of Emergence: its question, and what the visitor does.",
          href: "explorations/emergence/index.html",
          thumb: "assets/img/explore/emergence.jpg",
          status: "In progress"
        },
        {
          type: "project", index: "05",
          title: "Perforation",
          text: "Touch the surface to seed growth. The steel is cut wherever the pattern takes hold — a small field in which to watch the life-processes on the columns emerge.",
          href: "explorations/perforation/index.html",
          thumb: "assets/img/explore/perforation.jpg"
        }
      ]
    },

    /* ------------------------------------------------------------- */
    {
      id: "structure",
      label: "Structure",
      heading: "Structure & process",
      lede: "Documentation of how the columns were designed, cut and assembled.",
      items: [
        {
          type: "image", span: 3, ratio: "1428/943",
          src: "assets/img/structure.jpg",
          alt: "Four spiralling cor-ten columns with perforated reaction-diffusion patterns",
          caption: "Visualisation of the four columns. <em>Placeholder image — replace with site photographs.</em>"
        },
        {
          type: "text", span: 1,
          title: "Four columns in dynamic balance",
          body: "<p>Placeholder. Each column is a stack of folded steel boxes, every layer rotated slightly from the one below so that the column turns as it rises. Write about the structural idea, the balance between the four columns and how they lean on one another.</p><p>A second paragraph can go here — the material, the site, the scale of the body against six metres of steel.</p>"
        },
        {
          type: "text", span: 1,
          title: "Material",
          body: "<p>Placeholder. Weathering steel, laser cut and folded. The surface rusts to a stable patina over the course of the exhibition.</p>"
        },
        {
          type: "video", span: 2, ratio: "960/920",
          src: "assets/video/growth.mp4",
          poster: "assets/video/growth-poster.jpg",
          caption: "Growth of the perforation pattern (reaction–diffusion simulation). <em>Placeholder — replace with process footage.</em>"
        },
        {
          type: "image", span: 1, ratio: "900/738",
          src: "assets/img/detail-02.jpg",
          alt: "Detail of weathered steel surface",
          caption: "Surface study. <em>Placeholder.</em>"
        },
        {
          type: "text", span: 2,
          title: "Pattern",
          body: "<p>Placeholder. The perforations are generated by a reaction–diffusion process: two simulated chemicals feeding and inhibiting one another until stripes, labyrinths and spots emerge. Denser tendrils at the top give way to more solid steel towards the base.</p>"
        },
        {
          type: "image", span: 2, ratio: "900/600",
          src: "assets/img/detail-01.jpg",
          alt: "Detail of weathered steel surface",
          caption: "Fabrication — cutting and folding. <em>Placeholder.</em>"
        }
      ]
    },

    /* ------------------------------------------------------------- */
    {
      id: "events",
      label: "Events",
      heading: "Upcoming events",
      lede: "Walk-throughs, talks and workshops at the installation during the Biennale.",
      items: [
        {
          type: "event", span: 4,
          date: "2026-12-12", time: "17:00",
          title: "Event title (placeholder)",
          place: "Venue, New Delhi",
          text: "Placeholder. A short description of the event — who is speaking, what happens, whether registration is needed.",
          link: "#", linkLabel: "Details"
        },
        {
          type: "event", span: 4,
          date: "2026-12-19", time: "11:00",
          title: "Event title (placeholder)",
          place: "Venue, New Delhi",
          text: "Placeholder. A workshop or a walk-through with the team that built the columns.",
          link: "#", linkLabel: "Register"
        },
        {
          type: "event", span: 4,
          date: "2027-01-09", time: "16:00",
          title: "Event title (placeholder)",
          place: "Venue, New Delhi",
          text: "Placeholder.",
          link: "", linkLabel: ""
        }
      ]
    },

    /* ------------------------------------------------------------- */
    {
      id: "credits",
      label: "Credits",
      heading: "Credits",
      lede: "Turning Point was conceived, designed and built at Anant University.",
      items: [
        {
          type: "credits", span: 3,
          groups: [
            { role: "Concept & design",     names: ["Name Surname", "Name Surname"] },
            { role: "Pattern & computation", names: ["Name Surname"] },
            { role: "Structure & engineering", names: ["Name Surname", "Name Surname"] },
            { role: "Fabrication",          names: ["Fabricator name, City"] },
            { role: "Student team",         names: ["Name Surname", "Name Surname", "Name Surname", "Name Surname"] },
            { role: "Website",              names: ["Name Surname"] }
          ]
        },
        {
          type: "links", span: 1,
          title: "Follow",
          links: [
            { label: "Instagram", url: "#" },
            { label: "YouTube",   url: "#" },
            { label: "Anant University", url: "#" },
            { label: "Delhi Art Biennale", url: "#" }
          ]
        }
      ]
    }
  ]
};
