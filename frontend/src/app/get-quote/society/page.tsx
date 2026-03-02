"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Home, Check, ChevronDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import Navbar from "@/components/landing-page/Navbar"
import StickyCTA from "@/components/common/StickyCTA"
import { QuoteProgress } from "@/components/quote/quote-progress"
import { hyderabadSocieties, type Society } from "@/data/get-quote/societies"

export default function SocietySelectionPage() {
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualSociety, setManualSociety] = useState("")
  const [manualArea, setManualArea] = useState("")
  const [open, setOpen] = useState(false)

  const filteredSocieties = hyderabadSocieties.filter(
    (society) =>
      society.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      society.area.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSocietySelect = (society: Society) => {
    setSelectedSociety(society)
    setOpen(false)
    setShowManualEntry(false)
  }

  const handleManualSubmit = () => {
    if (manualSociety.trim() && manualArea.trim()) {
      setSelectedSociety({
        id: 0,
        name: manualSociety.trim(),
        area: manualArea.trim(),
        type: "Custom Entry",
      })
      setShowManualEntry(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="fixed top-0 left-0 right-0 w-full h-20 md:h-24 bg-white z-50">
        <Navbar />
      </div>
      <div className="mt-20 md:mt-24 w-full">
        <div className="bg-neutral-light">
          {/* Progress Bar */}
          <QuoteProgress currentStep={1} />

          {/* Main Content */}
          <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
            <div className="space-y-6 md:space-y-8">
              {/* Step Header */}
              <div className="text-center space-y-3 md:space-y-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-primary-blue">Select your society</h1>
                <p className="text-base md:text-lg text-dark-text">Choose your apartment complex or society in Hyderabad</p>
              </div>

              {/* Society Search */}
              <Card className="p-4 md:p-6 shadow-sm">
                <CardContent className="p-0 space-y-4 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                    <label className="text-sm font-medium text-foreground">Search for your society</label>

                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between h-12 text-left bg-[rgba(26,54,93,0.1)] text-primary-blue border-primary-blue/30 hover:bg-[rgba(26,54,93,0.15)] hover:border-primary-blue/50 focus:border-primary-blue"
                        >
                          {selectedSociety ? (
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <MapPin className="h-4 w-4 text-primary-blue flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-primary-blue truncate">{selectedSociety.name}</div>
                                <div className="text-sm text-primary-blue/70 truncate">{selectedSociety.area}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-primary-blue/70">Search societies in Hyderabad...</span>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-primary-blue/70" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search societies..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="border-primary-blue/20 focus:border-primary-blue"
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-4 text-center space-y-2">
                                <p className="text-sm text-dark-text">No societies found.</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowManualEntry(true)
                                    setOpen(false)
                                  }}
                                  className="border-primary-blue/20 text-primary-blue hover:bg-primary-blue/10"
                                >
                                  Enter manually
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredSocieties.map((society) => (
                                <CommandItem
                                  key={society.id}
                                  value={society.name}
                                  onSelect={() => handleSocietySelect(society)}
                                  className="group flex items-center space-x-2 p-3 hover:bg-blue-100 hover:text-blue-900 data-[selected=true]:bg-blue-200 data-[selected=true]:text-blue-900 transition-colors duration-200"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 text-blue-600 group-hover:text-blue-900 flex-shrink-0",
                                      selectedSociety?.id === society.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <MapPin className="h-4 w-4 text-blue-600 group-hover:text-blue-900 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-blue-600 group-hover:text-blue-900 truncate">{society.name}</div>
                                    <div className="text-sm text-gray-600 group-hover:text-blue-800 truncate">
                                      {society.area} • {society.type}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Manual Entry Form */}
                  {showManualEntry && (
                    <Card className="p-4 bg-primary-blue/5 border-primary-blue/20">
                      <CardContent className="p-0 space-y-4">
                        <h3 className="font-medium text-primary-blue">Enter society details</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-foreground">Society Name</label>
                            <Input
                              placeholder="Enter society or building name"
                              value={manualSociety}
                              onChange={(e) => setManualSociety(e.target.value)}
                              className="mt-1 border-primary-blue/20 focus:border-primary-blue"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Area/Location</label>
                            <Input
                              placeholder="Enter area (e.g., Gachibowli, Kondapur)"
                              value={manualArea}
                              onChange={(e) => setManualArea(e.target.value)}
                              className="mt-1 border-primary-blue/20 focus:border-primary-blue"
                            />
                          </div>
                          <Button
                            onClick={handleManualSubmit}
                            disabled={!manualSociety.trim() || !manualArea.trim()}
                            className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white"
                          >
                            Confirm Society
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Selected Society Display */}
              {selectedSociety && (
                <Card className="p-4 bg-primary-blue/5 border-primary-blue/20">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-primary-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-primary-blue truncate">{selectedSociety.name}</h3>
                        <p className="text-sm text-dark-text truncate">
                          {selectedSociety.area} • {selectedSociety.type}
                        </p>
                      </div>
                      <Check className="h-5 w-5 text-primary-blue flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sticky CTA */}
          <StickyCTA
            continueHref={selectedSociety ? "/get-quote/floor-plan" : undefined}
            continueText="Continue to Floor Plans"
            disabled={!selectedSociety}
            showBackButton={false}
          />
          {!selectedSociety && (
            <div className="fixed bottom-20 md:bottom-24 left-0 right-0 text-center px-4">
              <p className="text-sm text-dark-text">Please select a society to continue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
