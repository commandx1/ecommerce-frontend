import { useId } from "react"

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SelectMenuSlideInDemo = () => {
  const id = useId()

  return (
    <div className="w-fit">
      <Select defaultValue="all">
        <SelectTrigger id={id} className="w-fit rounded-l-md rounded-r-none border-r-0">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent className="data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 data-[state=open]:zoom-in-100 duration-400">
          <SelectGroup>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="category2">Category 2</SelectItem>
            <SelectItem value="category3">Category 3</SelectItem>
            <SelectItem value="category4">Category 4</SelectItem>
            <SelectItem value="category5">Category 5</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectMenuSlideInDemo
