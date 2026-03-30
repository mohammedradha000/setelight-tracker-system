// src/ui/SatelliteList.js
export class SatelliteList {
    constructor(satManager, onSelect) {
        this.satManager = satManager
        this.onSelect = onSelect
        this.allSatellites = []
        this.filteredSatellites = []
        this.itemHeight = 40 // matches CSS padding/height
        this.visibleCount = 20
        this.startIndex = 0
        this.selectedNoradId = null

        this.container = document.getElementById('sat-list-container')
        this.listElement = document.getElementById('sat-list')
        this.searchInput = document.getElementById('sidebar-search')
        this.menuBtn = document.getElementById('menu-btn')
        this.sidebar = document.getElementById('sidebar')

        this.init()
    }

    init() {
        // Toggle Sidebar
        this.menuBtn.addEventListener('click', () => this.toggle())

        // Search filtering
        this.searchInput.addEventListener('input', (e) => {
            this.filter(e.target.value)
        })

        // Virtual Scroll
        this.container.addEventListener('scroll', () => {
            this.handleScroll()
        })

        // Handle clicks
        this.listElement.addEventListener('click', (e) => {
            const item = e.target.closest('.sat-item')
            if (item) {
                const noradId = parseInt(item.dataset.id)
                this.selectSatellite(noradId)
            }
        })
    }

    setSatellites(satellites) {
        this.allSatellites = satellites
        this.filteredSatellites = [...satellites]
        this.updateListHeight()
        this.render()
    }

    toggle() {
        const isOpen = !this.sidebar.classList.contains('hidden')
        if (isOpen) {
            this.close()
        } else {
            this.open()
        }
    }

    open() {
        this.sidebar.classList.remove('hidden')
        this.menuBtn.classList.add('active')
        this.render()
    }

    close() {
        this.sidebar.classList.add('hidden')
        this.menuBtn.classList.remove('active')
    }

    filter(query) {
        const q = query.toLowerCase()
        this.filteredSatellites = this.allSatellites.filter(s => 
            s.name.toLowerCase().includes(q) || 
            s.noradId.toString().includes(q) ||
            (s.country && s.country.toLowerCase().includes(q))
        )
        this.startIndex = 0
        this.container.scrollTop = 0
        this.updateListHeight()
        this.render()
    }

    updateListHeight() {
        this.listElement.style.height = `${this.filteredSatellites.length * this.itemHeight}px`
    }

    handleScroll() {
        const scrollTop = this.container.scrollTop
        const newStartIndex = Math.floor(scrollTop / this.itemHeight)
        
        if (newStartIndex !== this.startIndex) {
            this.startIndex = newStartIndex
            this.render()
        }
    }

    selectSatellite(noradId) {
        this.selectedNoradId = noradId
        const sat = this.allSatellites.find(s => s.noradId === noradId)
        if (sat && this.onSelect) {
            this.onSelect(sat)
        }
        this.render()
    }

    render() {
        if (this.sidebar.classList.contains('hidden')) return

        const endIndex = Math.min(this.startIndex + this.visibleCount + 5, this.filteredSatellites.length)
        const visibleItems = this.filteredSatellites.slice(this.startIndex, endIndex)
        
        let html = ''
        visibleItems.forEach((sat, i) => {
            const absIndex = this.startIndex + i
            const isSelected = sat.noradId === this.selectedNoradId
            html += `
                <div class="sat-item ${isSelected ? 'selected' : ''}" 
                     style="position: absolute; top: ${absIndex * this.itemHeight}px; left: 0; right: 0; height: ${this.itemHeight}px"
                     data-id="${sat.noradId}">
                    <span class="norad">${sat.noradId}</span>
                    <span class="name">${sat.name}</span>
                </div>
            `
        })
        
        this.listElement.innerHTML = html
    }
}
