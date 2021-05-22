import './UserTokens.css';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Observer, observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';

import { AccountVM } from '../../viewmodels/AccountVM';
import { Application } from '../../viewmodels/Application';
import { CryptoIcons } from '../../misc/Icons';
import Feather from 'feather-icons-react';
import { Link } from 'react-router-dom';
import { NavBar } from '../../components';
import { Toggle } from 'react-toggle-component';

export default observer(({ accountVM, app }: { accountVM?: AccountVM; app: Application }) => {
  const { allTokens } = accountVM;
  const [_, setForceRefresh] = useState(-1);

  useEffect(() => {
    return () => accountVM.save();
  }, []);

  return (
    <div className="page tokens">
      <div className="line-1">
        <NavBar title="Tokens" onBackClick={() => app.history.goBack()} />

        <Link to={`/addToken`}>
          <Feather icon="plus-circle" size={22} strokeWidth={1} />
        </Link>
      </div>

      <div className="content">
        <DragDropContext
          onDragEnd={(result) => {
            accountVM.moveToken(result.source.index, result.destination.index);
          }}
        >
          <Droppable droppableId={'tokens'}>
            {(provided, snapshot) => (
              <div className="tokens" {...provided.droppableProps} ref={provided.innerRef}>
                {allTokens.map((t, i) => {
                  return (
                    <Draggable key={t.id} draggableId={t.id} index={i} isDragDisabled={i === 0}>
                      {(provided, snapshot) => {
                        return (
                          <div
                            className={`token ${t.show ? 'on' : 'off'} ${i === 11 ? 'show-line' : ''}`}
                            onClick={(_) => {
                              if (i > 0) setForceRefresh((t.show = !t.show) ? Date.now() : Date.now());
                            }} // Ugly code: Force refresh UI
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <img src={CryptoIcons(t.symbol)} alt={t.symbol} />
                            <div className="desc">
                              <div>{t.symbol}</div>
                              <div className="amount">{t.amount}</div>
                            </div>

                            <Toggle
                              checked
                              onToggle={(_) => (t.show = !t.show)}
                              rightBorderColor="#6186ffa0"
                              rightKnobColor="#6186ffa0"
                              borderWidth="1px"
                              width="39px"
                            />
                          </div>
                        );
                      }}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
});