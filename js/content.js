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
          text: "Scroll to turn the column like a screw. After two turns it locks, and the pattern grows off its arms until it fills the screen — then the view pulls back to find the same pattern on a coral, a fish, a termite mound, and returns to the column.",
          href: "explorations/metamorphosis/index.html",
          thumb: "assets/img/explore/metamorphosis.jpg",
          status: "Prototype"
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
          type: "image", span: 3, ratio: "1800/1273",
          src: "assets/img/process/render-01.jpg",
          alt: "Visualisation of the four spiralling cor-ten columns on site",
          caption: "The four columns on site — visualisation."
        },
        {
          type: "text", span: 1,
          title: "Four columns in dynamic balance",
          body: "<p>Placeholder. Each column is a stack of folded steel boxes, every layer rotated slightly from the one below so that the column turns as it rises. Write about the structural idea, the balance between the four columns and how they lean on one another.</p><p>A second paragraph can go here — the material, the site, the scale of the body against six metres of steel.</p>"
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/render-02.jpg",
          alt: "Visualisation of the columns in evening light",
          caption: "Visualisation, evening light."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/render-05.jpg",
          alt: "Visualisation of the columns with a human figure for scale",
          caption: "Visualisation with a figure for scale."
        },
        {
          type: "text", span: 1,
          title: "Pattern",
          body: "<p>Placeholder. The perforations are generated by a reaction–diffusion process: two simulated chemicals feeding and inhibiting one another until stripes, labyrinths and spots emerge. Denser tendrils at the top give way to more solid steel towards the base.</p>"
        },
        {
          type: "image", span: 2, ratio: "1800/1531",
          src: "assets/img/process/pattern-study.jpg",
          alt: "Screenshot of the pattern generator showing the full-height pattern and a density curve",
          caption: "Pattern study — the full-height pattern and its density profile."
        },
        {
          type: "video", span: 1, ratio: "960/920",
          src: "assets/video/growth.mp4",
          poster: "assets/video/growth-poster.jpg",
          caption: "Growth of the pattern (reaction–diffusion simulation)."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/render-03.jpg",
          alt: "Visualisation looking up between the perforated columns",
          caption: "Between the columns, looking up."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/render-04.jpg",
          alt: "Visualisation of the columns from another side",
          caption: "Visualisation, second view."
        },
        {
          type: "text", span: 1,
          title: "Fabrication",
          body: "<p>Placeholder. How the layers were made — cutting, folding, welding — and who made them. A sentence on the workshop and the sequence from file to steel.</p>"
        },
        {
          type: "image", span: 3, ratio: "1800/1273",
          src: "assets/img/process/fab-welding.jpg",
          alt: "A welder working on a perforated steel box",
          caption: "Welding a folded layer."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-stack.jpg",
          alt: "Stacked perforated steel boxes",
          caption: "Finished layers, stacked."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-plate-detail.jpg",
          alt: "Close-up of a laser-cut perforated plate",
          caption: "A cut plate, before weathering settles."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-workshop-01.jpg",
          alt: "Perforated steel layers stacked in a workshop",
          caption: "Layers in the workshop."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-box-interior.jpg",
          alt: "Interior of a perforated steel box",
          caption: "Inside a layer: the patterned faces from within."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-layers.jpg",
          alt: "Close-up of several stacked perforated layers",
          caption: "Patterns across successive layers."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-weathering.jpg",
          alt: "Close-up of a rusting steel surface",
          caption: "The weathering surface."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-workshop-02.jpg",
          alt: "Two people inspecting stacked perforated layers in a workshop",
          caption: "Checking the stack in the workshop."
        },
        {
          type: "image", span: 2, ratio: "1800/1273",
          src: "assets/img/process/fab-corner.jpg",
          alt: "Corner of stacked perforated steel boxes",
          caption: "A corner of the stack."
        },
        {
          type: "image", span: 3, ratio: "1800/1273",
          src: "assets/img/process/fab-hall.jpg",
          alt: "Perforated steel boxes in a fabrication hall",
          caption: "Layers laid out in the fabrication hall."
        },
        {
          type: "text", span: 1,
          title: "Material",
          body: "<p>Placeholder. Weathering steel, laser cut and folded. The surface rusts to a stable patina over the course of the exhibition.</p>"
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
