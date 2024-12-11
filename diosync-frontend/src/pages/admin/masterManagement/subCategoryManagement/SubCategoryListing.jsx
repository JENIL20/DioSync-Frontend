import React, { useEffect, useState } from 'react'
import { BulkAction, BulkActionModel, DELETE, UPDATE } from '../../../../constants/roleConstants'
import TableLayout from '../../../../components/themeComponents/TableLayout'
import Button from '../../../../components/core/formComponents/Button'
import Modal from '../../../../components/core/Modal'
import AdminDeleteModal from '../../../../components/core/AdminDeleteModal'
import WhiteCard from '../../../../components/themeComponents/WhiteCard'
import SearchFilter from '../../../../components/core/formComponents/SearchFilter'
import { FiPlus } from 'react-icons/fi'
import AddSubCategory from './AddSubCategory'
import { DeleteSubCategories, GetSubCategories } from '../../../../services/subCategoryService'
import { deleteToastFun } from '../../../../utils/commonHelper'
import { hideLoader, showLoader, siteLoaderSelector } from '../../../../redux/slices/siteLoaderSlice'
import { useDispatch, useSelector } from 'react-redux'
import BulkHeader from '../../../../components/themeComponents/BulkHeader'
import { BulkPerformAction } from '../../../../services/commonService'

function SubCategoryListing() {
  const dispatch = useDispatch()
  const itemsPerPage = 10
  const [totalItemsOnPage, setTotalItemsOnPage] = useState(0)
  const [itemOffset, setItemOffset] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [currentItems, setCurrentItems] = useState([])
  const [orderby, setOrderby] = useState('')
  const [order, setOrder] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState()
  const [searchItem, setSearchItem] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedAction, setSelectedAction] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  const tableHeader = [
    {
      key: 'Subcategory',
      value: 'sub_category_name',
      sorting: true,
      sortkey: 'sub_category_name',
      clickable: false,
    },
    {
      key: 'Category',
      value: 'category.name',
      sorting: true,
      sortkey: 'category__name',
      clickable: false,
    },
    { key: 'Status', value: 'is_active', sorting: true, sortkey: 'is_active', clickable: false },
    {
      key: 'Actions',
      value: 'actions',
      sorting: false,
      clickable: false,
    },
  ]
  useEffect(() => {
    const debounce = setTimeout(() => {
      getSubCategoriesData()
    }, 300)
    return () => {
      clearTimeout(debounce)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchItem, orderby, order, itemOffset])

  useEffect(() => {
    setItemOffset(0)
  }, [searchItem])

  const getSubCategoriesData = async () => {
    dispatch(showLoader())
    const orderVal = order ? '' : '-'
    let queryString = `?page=${itemOffset / itemsPerPage + 1}`
    if (orderby) {
      queryString += `&ordering=${orderVal}${orderby}`
    }
    if (searchItem) {
      queryString += `&search=${searchItem}`
    }
    const response = await GetSubCategories(queryString)
    const results = response?.data?.data?.results || []
    const count = response?.data?.data?.count || 0
    setCurrentItems(results)
    setPageCount(Math.ceil(count / itemsPerPage))
    setTotalItemsOnPage(results.length)
    setTotalCount(count)

    dispatch(hideLoader())
  }

  const handlePageClick = (event) => {
    const newOffset = event.selected * itemsPerPage
    setItemOffset(newOffset)
  }

  const handleSorting = (data, order) => {
    setOrderby(data)
    setOrder(order)
  }

  const handleOptions = (optionValue, item) => {
    switch (optionValue) {
      case UPDATE:
        setSelectedItem(item)
        setOpenModal(true)
        break
      case DELETE:
        setOpenDeleteModal(true)
        setSelectedItem(item?.id)
        break
      default:
        break
    }
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setSelectedItem('')
  }

  const handleAddSubCategory = () => {
    setOpenModal(true)
  }

  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false)
    setSelectedItem('')
  }

  const handleDeleteSubCategory = async () => {
    const response = await DeleteSubCategories(selectedItem)
    if (response?.status === 204) {
      deleteToastFun('Sub category deleted successfully', 'success')
      handleCloseDeleteModal()
      if (totalItemsOnPage === 1 && itemOffset > 0) {
        setItemOffset(itemOffset - itemsPerPage) // Go to the previous page
      } else {
        getSubCategoriesData()
      }
    } else {
      deleteToastFun('Something went wrong', 'error')
    }
  }

  const handleBulk = (data) => {
    const updatedSelectedIds = selectedIds?.includes(data.id)
      ? selectedIds?.filter((id) => id !== data.id)
      : [...selectedIds, data.id]

    setSelectedIds(updatedSelectedIds)
  }

  const handleAllBulk = (data) => {
    if (selectedIds?.length === data?.length) {
      setSelectedIds([])
    } else {
      const allIds = data?.map((item) => item.id)
      setSelectedIds(allIds)
    }
  }

  const handleApplyAction = () => {
    if (selectedAction) {
      switch (selectedAction) {
        case 'active':
          const activeBody = {
            model: BulkActionModel?.sub_category,
            ids: selectedIds,
            action: BulkAction?.ACTIVE,
          }
          handleBulkApplyAction(activeBody)
          break
        case 'delete':
          const deleteBody = {
            model: BulkActionModel?.sub_category,
            ids: selectedIds,
            action: BulkAction?.DELETED,
          }
          handleBulkApplyAction(deleteBody)
          break
        case 'inactive':
          const inActiveBody = {
            model: BulkActionModel?.sub_category,
            ids: selectedIds,
            action: BulkAction?.INACTIVE,
          }
          handleBulkApplyAction(inActiveBody)
          break
        default:
          break
      }
    }
  }

  const handleBulkApplyAction = async (data) => {
    dispatch(showLoader())
    const response = await BulkPerformAction(data)
    if (response?.status === 200) {
      getSubCategoriesData()
      setSelectedIds([])
      setSelectedAction('')
    }
    dispatch(hideLoader())
  }

  const handleSelectAction = (data) => {
    setSelectedAction(data)
  }

  return (
    <>
      <WhiteCard>
        <div className='grid grid-cols-12 gap-4'>
          <BulkHeader
            addName='Add Subcategory'
            handleAddFun={handleAddSubCategory}
            selectedIds={selectedIds}
            setSearchItem={setSearchItem}
            searchItem={searchItem}
            selectedAction={selectedAction}
            handleSelectAction={handleSelectAction}
            handleApplyAction={handleApplyAction}
          />

          <div className='col-span-12'>
            <TableLayout
              tableHeader={tableHeader}
              totalCount={totalCount}
              handleOptions={handleOptions}
              currentItems={currentItems}
              isEdit={true}
              isDelete={true}
              isView={false}
              handlePageClick={handlePageClick}
              pageCount={pageCount}
              itemOffset={itemOffset}
              itemsPerPage={itemsPerPage}
              handleSorting={handleSorting}
              handleBulk={handleBulk}
              handleAllBulk={handleAllBulk}
              selectedIds={selectedIds}
              isBulkActive={true}
            />
          </div>
        </div>
      </WhiteCard>
      {openModal && (
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          header
          headingText={selectedItem?.id ? 'Edit Subcategory' : 'Add Subcategory'}
          width={'md:w-[700px]'}
        >
          <AddSubCategory
            handleCloseModal={handleCloseModal}
            selectedItem={selectedItem}
            getSubCategoriesData={getSubCategoriesData}
          />
        </Modal>
      )}
      {openDeleteModal && (
        <Modal
          open={openDeleteModal}
          onClose={handleCloseDeleteModal}
          headingText={'Delete Confirmation'}
          width={'md:w-[700px]'}
        >
          <AdminDeleteModal
            openDeleteModal={openDeleteModal}
            handleCloseDeleteModal={handleCloseDeleteModal}
            deleteFunction={handleDeleteSubCategory}
            deleteLabel={'Are you sure you want to delete this sub category?'}
          />
        </Modal>
      )}
    </>
  )
}

export default SubCategoryListing